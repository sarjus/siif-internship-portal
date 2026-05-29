export type StudentProfileCompletionFields = {
  phone?: string | null
  college_name?: string | null
  programme?: string | null
  study_year?: string | null
  current_cgpa?: string | null
  back_papers?: number | null
  department?: string | null
  skills?: string[] | null
}

function isMissingText (value: string | null | undefined): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

export function isIncompleteStudentProfile (profile: StudentProfileCompletionFields | null): boolean {
  if (!profile) return true

  if (isMissingText(profile.phone)) return true
  if (isMissingText(profile.college_name)) return true
  if (isMissingText(profile.programme)) return true
  if (isMissingText(profile.study_year)) return true
  if (isMissingText(profile.current_cgpa)) return true
  if (profile.back_papers === null || profile.back_papers === undefined) return true
  if (isMissingText(profile.department)) return true
  if (!Array.isArray(profile.skills) || profile.skills.length === 0) return true

  return false
}
