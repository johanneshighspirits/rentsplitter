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

    @content = {
      heading1: "Inbjudan",
      greeting: "Hej #{@member.first_name}",
      body: [
        "<b>#{@sender.name}</b> har bjudit in dig till RentSplitter-projektet <i>#{@project_name}</i>.",
        "För att acceptera, klicka på länken nedan:",
      ],
      call_to_action_href: edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)
      call_to_action_title: "Acceptera inbjudan",
    }
    mail to: @member.email, subject: "RentSplitter Invitation"
    puts "ACTIVATION LINK for #{@member.name}:"
    puts edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)
  end

  def activation(member)
    @member = member
    mail to: member.email, subject: "RentSplitter Activation"
  end
  
end
