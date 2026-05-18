// TODO: replace with BE data
export interface FixtureUser {
  display_name: string
  email: string
  language: 'vi' | 'en' | 'fi'
}

export const fixtureUser: FixtureUser = {
  display_name: 'Nguyễn Văn A',
  email: 'user@example.com',
  language: 'vi',
}
