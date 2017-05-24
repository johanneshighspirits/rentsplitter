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
        "För att acceptera, klicka på länken nedan:"
      ],
      call_to_action_href: (edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)),
      call_to_action_title: "Acceptera inbjudan"
    }
    mail to: @member.email, subject: "RentSplitter Invitation"
    puts "ACTIVATION LINK for #{@member.name}:"
    puts edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)
  end

  def activation(member)
    @member = member

    @content = {
      heading1: "Aktivering",
      greeting: "Hej #{@member.first_name}",
      body: [
        "Du är snart redo att börja använda <b>RentSplitter</b>. Klicka på aktiveringslänken nedan för att komma igång.",
        "Om du inte har använt denna epostadress för att skapa ett konto hos RentSplitter kan du bortse från detta mail."
      ],
      call_to_action_href: edit_invitation_url(@member.invitation_token, email: @member.email),
      call_to_action_title: "Aktivera"
    }
    mail to: member.email, subject: "RentSplitter Activation"
    puts "INVITATION LINK for #{@member.name}:"
    puts edit_invitation_url(@member.invitation_token, email: @member.email)
  end


  
end
