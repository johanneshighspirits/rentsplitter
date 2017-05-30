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

  def invitation_accepted(member)
    @member = member
    project = Project.find(@member.current_project_id)
    @project_admin = Member.find(project.admin_id)
    @project_name = project.name
    @content = {
      heading1: "Invitation accepted",
      greeting: "Hej #{@project_admin.first_name}",
      body: [
        "<b>#{@member.name}</b> has accepted your invitation and is now an active member of your project <i>#{@project_name}</i>."
      ]
    }
    mail to: @project_admin.email, subject: "#{@member.first_name} accepted your invitation."
  end

  def activation(member)
    @member = member

    @content = {
      heading1: "Aktivering",
      greeting: "Hej #{@member.first_name}",
      body: [
        "Du är snart redo att börja använda <b>RentSplitter</b>. Klicka på aktiveringslänken nedan för att komma igång.",
        "Om du inte har använt denna epostadress för att skapa ett konto hos <b>RentSplitter</b> kan du bortse från detta mail."
      ],
      call_to_action_href: edit_invitation_url(@member.invitation_token, email: @member.email),
      call_to_action_title: "Aktivera"
    }
    mail to: member.email, subject: "RentSplitter Activation"
    puts "INVITATION LINK for #{@member.name}:"
    puts edit_invitation_url(@member.invitation_token, email: @member.email)
  end

  def password_reset(member)
    @member = member

    @content = {
      heading1: "Återställning av lösen",
      greeting: "Hej #{@member.first_name}",
      body: [
        "För att återställa ditt lösenord, klicka på nedanstående länk."
      ],
      call_to_action_href: edit_password_reset_url(@member.reset_token, email: @member.email),
      call_to_action_title: "Återställ lösenord",
      additional: [
        "Länken är giltig i två timmar.",
        " ",
        "Om du inte begärt att få ditt lösenord återställt kan du bortse från detta mail."
      ]
    }
    mail to: member.email, subject: "Password reset"
    puts "PASSWORD RESET LINK for #{@member.name}:"
    puts edit_password_reset_url(@member.reset_token, email: @member.email)
  end

  def invoice(member, info)
    @template = "invoice"
    @sender = info[:sender]
    @project_name = info[:project_name]
    @debt = info[:debt].round()
    @due_date = info[:due_date]

    @member = member

    @content = {
      heading1: "Räkning",
      greeting: "Hej #{@member.first_name}",
      body: [
        "Dags att betala hyran för <b>#{@project_name}</b> igen."
      ],
      invoice_number: "#{@member.name}",
      account_info: info[:account_info],
      additional: [
        "För att se hela uträkningen, klicka på länken nedan:"
      ],
      call_to_action_href: root_url,
      call_to_action_title: "#{@project_name}"
    }
    mail to: @member.email, subject: "#{@project_name} | #{info[:for_month]}"
  end

  def invoice_reminder_for_project_admin(project_admin, project)
    @project_name = project.name
    @content = {
      heading1: "Skicka räkningar",
      greeting: "Hej #{project_admin.first_name}",
      body: [
        "Det är dags att skicka ut räkningar för <b>#{@project_name}</b>"
      ],
      call_to_action_href: projects_url,
      call_to_action_title: "Öppna #{@project_name}"
    }    
    mail to: project_admin.email, subject: "Reminder to send invoices for '#{@project_name}'"
  end

  
end
