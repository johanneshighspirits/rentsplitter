class MemberMailer < ApplicationMailer

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.member_mailer.invitation.subject
  #
  def invitation(member, info)
    @sender = info[:sender]
    project = info[:project]
    @project_name = project.name
    @member = member

    @content = {
      heading1: "Inbjudan",
      greeting: "Hej #{@member.first_name}",
      body: [
        "<b>#{@sender.name}</b> har bjudit in dig till RentSplitter-projektet <i>#{project.name}</i>.",
        "För att acceptera, klicka på länken nedan:"
      ],
      call_to_action_href: (edit_invitation_url(@member.invitation_token, email: @member.email, set_password: !@member.activated)),
      call_to_action_title: "Acceptera inbjudan"
    }

    smtp_headers = {
      category: "Invitation",
      unique_args: {
        project_id: project.id
      }
    }
    headers['X-SMTPAPI'] = smtp_headers.to_json

    mail to: @member.email, subject: "RentSplitter Invitation"
    puts "ACTIVATION LINK for #{@member.name}:"
    puts edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)
  end

  def invitation_sent(member)
    @member = member
    project = Project.find(@member.current_project_id)
    @project_admin = Member.find(project.admin_id)
    @project_name = project.name
    @content = {
      heading1: "Invitation sent",
      greeting: "Hej #{@project_admin.first_name}",
      body: [
        "<b>#{@member.name}</b> has been invited to your Project <i>#{@project_name}</i>.",
        "Below is the activation link, don't click it unless #{@member.first_name} never gets an invitation."
      ],
      call_to_action_href: (edit_invitation_url(@member.invitation_token, email: @member.email, set_password: true)),
      call_to_action_title: "#{@member.name}'s activation link"
    }

    mail to: @project_admin.email, subject: "#{@member.first_name} has been invited to #{@project_name}."
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

  def information(recipient, subject, message)
    @content = {
      heading1: subject,
      greeting: "Hi #{recipient.first_name}",
      body: message
    }
    mail to: recipient.email, subject: subject
  end
  
  def booking(member, info)
    @project_name = info[:project_name]
    @project_id = info[:project_id]
    @bookedDate = info[:bookedDate]
    @bookedTime = info[:bookedTime]
    @content = {
      heading1: "Booking confirmed",
      greeting: "Hi #{member.first_name}",
      body: [
        "Your booking:",
        "#{@project_name}.",
        "#{@bookedDate} #{@bookedTime}"
      ],
      call_to_action_href: calendar_event_url(@project_id),
      call_to_action_title: "Open Calendar" 
    }
    mail to: member.email, subject: "RentSplitter Booking"
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
    project = info[:project]
    @project_name = project.name
    @debt = info[:debt].round()
    @due_date = info[:due_date]

    @member = member
    @admin = Member.find(project.admin_id)

    @content = {
      heading1: "Räkning",
      greeting: "Hej #{@member.first_name}",
      body: [
        "Dags att betala hyran för <b>#{@project_name}</b>."
      ],
      invoice_number: "#{@member.name}",
      account_info: info[:account_info],
      additional: [
        "För att se hela uträkningen, klicka på länken nedan:"
      ],
      call_to_action_href: project_url(project),
      call_to_action_title: "#{@project_name}"
    }

    smtp_headers = {
      category: "Invoice",
      unique_args: {
        project_id: project.id
      }
    }
    headers['X-SMTPAPI'] = smtp_headers.to_json
    puts "Mailing to #{@member.email}, bcc: #{@admin.email}, subject: #{@project_name} | Rent for #{info[:for_month]}"
    mail to: @member.email, bcc: @admin.email, subject: "#{@project_name} | Rent for #{info[:for_month]}"
  end

  def invoice_reminder_for_project_admin(project_admin, project)
    @project_name = project.name
    @content = {
      heading1: "Skicka räkningar",
      greeting: "Hej #{project_admin.first_name}",
      body: [
        "Det är dags att skicka ut räkningar för <b>#{@project_name}</b>"
      ],
      call_to_action_href: project_url(project),
      call_to_action_title: "Öppna #{@project_name}"
    }    
    mail to: project_admin.email, subject: "Reminder to send invoices for '#{@project_name}'"
  end

  
end
