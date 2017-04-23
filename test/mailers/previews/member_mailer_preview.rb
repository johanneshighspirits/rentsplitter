# Preview all emails at http://localhost:3000/rails/mailers/member_mailer
class MemberMailerPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/member_mailer/invitation
  def invitation
    member = Member.first
    member.invitation_token = Member.new_token
    MemberMailer.invitation(member)
  end

end
