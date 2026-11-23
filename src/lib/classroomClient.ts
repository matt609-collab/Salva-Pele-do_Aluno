import {
  ActivityMaterial,
  ActivityStatus,
  ClassroomActivity,
  ClassroomAnnouncement,
  ClassroomCourse,
  ClassroomPerson,
  ClassroomSyncPayload,
} from '../types';

const COURSE_PALETTE = [
  '#2563EB',
  '#DC2626',
  '#7C3AED',
  '#059669',
  '#D97706',
  '#0891B2',
  '#DB2777',
  '#4F46E5',
];

export class ClassroomAuthExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClassroomAuthExpiredError';
  }
}

async function fetchGoogleJson<T>(
  url: string,
  accessToken: string
): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    return { ok: false, status: res.status, errorText };
  }

  const data = (await res.json()) as T;
  return { ok: true, status: res.status, data };
}

function formatDueDate(
  dueDate?: { year?: number; month?: number; day?: number },
  dueTime?: { hours?: number; minutes?: number }
): { dueDateIso?: string; dueTimeDisplay?: string; dueTimestamp?: number } {
  if (!dueDate?.year || !dueDate?.month || !dueDate?.day) {
    return {};
  }
  const yyyy = String(dueDate.year).padStart(4, '0');
  const mm = String(dueDate.month).padStart(2, '0');
  const dd = String(dueDate.day).padStart(2, '0');
  const dueDateIso = `${yyyy}-${mm}-${dd}`;

  if (dueTime && (dueTime.hours !== undefined || dueTime.minutes !== undefined)) {
    const utcDate = new Date(
      Date.UTC(
        dueDate.year,
        dueDate.month - 1,
        dueDate.day,
        dueTime.hours ?? 23,
        dueTime.minutes ?? 59
      )
    );
    const localHours = String(utcDate.getHours()).padStart(2, '0');
    const localMinutes = String(utcDate.getMinutes()).padStart(2, '0');
    return {
      dueDateIso,
      dueTimeDisplay: `${localHours}:${localMinutes}`,
      dueTimestamp: utcDate.getTime(),
    };
  }

  const endOfDay = new Date(dueDate.year, dueDate.month - 1, dueDate.day, 23, 59, 59);
  return {
    dueDateIso,
    dueTimeDisplay: '23:59',
    dueTimestamp: endOfDay.getTime(),
  };
}

function extractMaterials(rawMaterials?: any[]): ActivityMaterial[] {
  if (!Array.isArray(rawMaterials)) return [];
  const items: ActivityMaterial[] = [];

  for (const m of rawMaterials) {
    if (m?.driveFile?.driveFile) {
      items.push({
        title: m.driveFile.driveFile.title || 'Arquivo no Google Drive',
        url: m.driveFile.driveFile.alternateLink,
        type: 'drive',
      });
    } else if (m?.youtubeVideo) {
      items.push({
        title: m.youtubeVideo.title || 'Vídeo do YouTube',
        url: m.youtubeVideo.alternateLink,
        type: 'youtube',
      });
    } else if (m?.link) {
      items.push({
        title: m.link.title || m.link.url || 'Link externo',
        url: m.link.url,
        type: 'link',
      });
    } else if (m?.form) {
      items.push({
        title: m.form.title || 'Formulário Google',
        url: m.form.formUrl,
        type: 'form',
      });
    }
  }
  return items;
}

export async function syncClassroomFromGoogle(
  accessToken: string
): Promise<ClassroomSyncPayload> {
  // Fetch all courses linked to the signed-in Google account (both student and teacher-created courses)
  const coursesResp = await fetchGoogleJson<{ courses?: any[] }>(
    'https://classroom.googleapis.com/v1/courses?pageSize=50',
    accessToken
  );

  if (coursesResp.status === 401) {
    throw new ClassroomAuthExpiredError(
      'Sua sessão do Google Classroom expirou. Faça login novamente para atualizar.'
    );
  }

  if (!coursesResp.ok) {
    let googleMsg = '';
    try {
      const parsed = JSON.parse(coursesResp.errorText || '{}');
      googleMsg = parsed?.error?.message || '';
    } catch {
      googleMsg = coursesResp.errorText || '';
    }
    throw new Error(
      googleMsg
        ? `Erro do Google Classroom (${coursesResp.status}): ${googleMsg}`
        : `Não foi possível consultar turmas no Google Classroom (código ${coursesResp.status}).`
    );
  }

  const allRawCourses = coursesResp.data?.courses ?? [];
  // Keep ACTIVE and PROVISIONED (newly created) courses, filter out ARCHIVED / DECLINED
  const rawCourses = allRawCourses.filter(
    (c) => c.courseState !== 'ARCHIVED' && c.courseState !== 'DECLINED'
  );

  const nowMs = Date.now();
  const allActivities: ClassroomActivity[] = [];
  const allAnnouncements: ClassroomAnnouncement[] = [];

  const hydratedCourses: ClassroomCourse[] = await Promise.all(
    rawCourses.map(async (course, index) => {
      const courseId = String(course.id);
      const colorHex = COURSE_PALETTE[index % COURSE_PALETTE.length];

      const [cwRes, subRes, teachRes, studRes, annRes] = await Promise.all([
        fetchGoogleJson<{ courseWork?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(
            courseId
          )}/courseWork?pageSize=50`,
          accessToken
        ),
        fetchGoogleJson<{ studentSubmissions?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(
            courseId
          )}/courseWork/-/studentSubmissions?userId=me&pageSize=100`,
          accessToken
        ),
        fetchGoogleJson<{ teachers?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(
            courseId
          )}/teachers?pageSize=20`,
          accessToken
        ),
        fetchGoogleJson<{ students?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(
            courseId
          )}/students?pageSize=60`,
          accessToken
        ),
        fetchGoogleJson<{ announcements?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(
            courseId
          )}/announcements?pageSize=15`,
          accessToken
        ),
      ]);

      const teachers: ClassroomPerson[] = (
        teachRes.ok ? teachRes.data?.teachers ?? [] : []
      ).map((t) => ({
        userId: String(t.userId || ''),
        name: t.profile?.name?.fullName || 'Professor(a)',
        email: t.profile?.emailAddress,
        photoUrl: t.profile?.photoUrl
          ? t.profile.photoUrl.startsWith('//')
            ? `https:${t.profile.photoUrl}`
            : t.profile.photoUrl
          : undefined,
      }));

      const rosterRestricted =
        !studRes.ok && (studRes.status === 403 || studRes.status === 404);

      const students: ClassroomPerson[] = (
        studRes.ok ? studRes.data?.students ?? [] : []
      ).map((s) => ({
        userId: String(s.userId || ''),
        name: s.profile?.name?.fullName || 'Estudante',
        email: s.profile?.emailAddress,
        photoUrl: s.profile?.photoUrl
          ? s.profile.photoUrl.startsWith('//')
            ? `https:${s.profile.photoUrl}`
            : s.profile.photoUrl
          : undefined,
      }));

      const submissionByWorkId = new Map<string, any>();
      for (const sub of subRes.ok ? subRes.data?.studentSubmissions ?? [] : []) {
        if (sub.courseWorkId) {
          submissionByWorkId.set(String(sub.courseWorkId), sub);
        }
      }

      const primaryTeacher = teachers[0];
      const courseWorkList = cwRes.ok ? cwRes.data?.courseWork ?? [] : [];

      let pendingCount = 0;
      let returnedCount = 0;
      let overdueCount = 0;

      for (const cw of courseWorkList) {
        const cwId = String(cw.id);
        const sub = submissionByWorkId.get(cwId);
        const subState: string = sub?.state || 'NEW';
        const { dueDateIso, dueTimeDisplay, dueTimestamp } = formatDueDate(
          cw.dueDate,
          cw.dueTime
        );

        let status: ActivityStatus = 'pendente';

        if (subState === 'TURNED_IN') {
          status = 'concluida';
        } else if (subState === 'RETURNED') {
          if (sub?.assignedGrade !== undefined && sub?.assignedGrade !== null) {
            status = 'concluida';
          } else {
            status = 'devolvida';
            returnedCount += 1;
          }
        } else {
          if (dueTimestamp && dueTimestamp < nowMs) {
            status = 'atrasada';
            overdueCount += 1;
          } else {
            status = 'pendente';
            pendingCount += 1;
          }
        }

        allActivities.push({
          id: cwId,
          courseId,
          courseName: course.name || 'Turma sem nome',
          courseColor: colorHex,
          title: cw.title || 'Atividade sem título',
          description: cw.description || '',
          workType: cw.workType || 'ASSIGNMENT',
          state: cw.state,
          dueDateIso,
          dueTimeDisplay,
          dueTimestamp,
          creationTime: cw.creationTime,
          maxPoints: cw.maxPoints,
          assignedGrade: sub?.assignedGrade,
          submissionState: subState,
          late: Boolean(sub?.late),
          status,
          alternateLink: cw.alternateLink,
          materials: extractMaterials(cw.materials),
          teacherEmail: primaryTeacher?.email,
          teacherName: primaryTeacher?.name,
        });
      }

      const announcementsList = annRes.ok ? annRes.data?.announcements ?? [] : [];
      for (const ann of announcementsList) {
        const created = ann.creationTime || new Date().toISOString();
        const dateIso = created.slice(0, 10);
        const creator = teachers.find((t) => t.userId === ann.creatorUserId);
        allAnnouncements.push({
          id: String(ann.id),
          courseId,
          courseName: course.name || 'Turma',
          courseColor: colorHex,
          text: ann.text || '',
          creationTime: created,
          dateIso,
          alternateLink: ann.alternateLink,
          creatorName: creator?.name || primaryTeacher?.name || 'Professor(a)',
        });
      }

      return {
        id: courseId,
        name: course.name || 'Turma sem nome',
        section: course.section || '',
        room: course.room || '',
        descriptionHeading: course.descriptionHeading || '',
        alternateLink: course.alternateLink,
        courseState: course.courseState,
        colorHex,
        teachers,
        students,
        rosterRestricted,
        pendingCount,
        returnedCount,
        overdueCount,
        totalActivities: courseWorkList.length,
      };
    })
  );

  allActivities.sort((a, b) => {
    const aDone = a.status === 'concluida' ? 1 : 0;
    const bDone = b.status === 'concluida' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (a.dueTimestamp && b.dueTimestamp) return a.dueTimestamp - b.dueTimestamp;
    if (a.dueTimestamp) return -1;
    if (b.dueTimestamp) return 1;
    return 0;
  });

  return {
    syncedAt: new Date().toISOString(),
    courses: hydratedCourses,
    activities: allActivities,
    announcements: allAnnouncements,
  };
}
