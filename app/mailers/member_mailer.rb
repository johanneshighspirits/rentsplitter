class MemberMailer < ApplicationMailer

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.member_mailer.invitation.subject
  #
  def invitation(member)
    @sender = {
      first_name: "Johannes",
      last_name: "Borgström"
    }
    @member = member
    mail to: member.email, subject: "RentSplitter Invitation"
  end
end
