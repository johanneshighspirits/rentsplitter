class InvitationsController < ApplicationController

  def create
    member = Member.find(params[:member])
    project = Project.find(params[:project_id])
    member.send_invitation_email(sender: current_member, project: project)
    flash[:success] = "Invitation sent to #{member.name}"
    redirect_to members_path
  end

  # Member clicked on invitation link, thereby accepting the invitation
  # /invitations/<token>/edit?email=<url escaped email address>
  def edit
    member = Member.find_by(email: params[:email])
    if member && member.authenticated?(:invitation, params[:id])
      puts "Member invitation authenticated"
      # Check if someone is logged in already
      # If logged in member differs from the invited member,
      # log out current member and log in new member
      if current_member && !current_member?(member)
        puts "Logging out #{current_member.name}."
        log_out
      end
      message = "Welcome #{member.first_name}!"
      puts "Invitation accepted by '#{member.name}, <#{member.email}>'"
      # Choose password if not already activated
      if member.activated?
        # Prompt for password
        redirect_to login_path
      else
        puts "Activating #{member.name}"
        member.activate
        puts "Logging in #{member.name}"
        log_in member
        # Let user choose a password
        if params[:set_password]
          # Member has been invited and must choose password
          redirect_to edit_member_path member, set_password: true
        else
          # Member
          redirect_to edit_member_path member
        end
      end
      # Activate member if not already activated
      # unless member.activated?
      #   member.update_attribute(:activated, true)
      #   message += "Your account has been activated."
      #   puts "Account activated for '#{member.name}, <#{member.email}>'"
      # end
      # puts "Logging in #{member.name}"
      # log_in member
      # puts "Remembering #{member.name}"
      # remember member
      flash[:success] = message
    else
      flash[:danger] = "There is something wrong with the activation link."
      redirect_to root_path
    end
  end

end
