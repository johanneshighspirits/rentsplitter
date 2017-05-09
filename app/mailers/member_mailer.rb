class MemberMailer < ApplicationMailer

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.member_mailer.invitation.subject
  #
  def invitation(member, info)
    @sender = info[:sender]
    @project_name = info[:project_name]
    @member = member
    mail to: member.email, subject: "RentSplitter Invitation"
  end

  def activation(member)
    @member = member
    mail to: member.email, subject: "RentSplitter Activation"
  end
  
end
