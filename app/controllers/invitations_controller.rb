class InvitationsController < ApplicationController

  # Member clicked on invitation link, thereby accepting the invitation
  # /invitations/<token>/edit?email=<url escaped email address>
  def edit
    member = Member.find_by(email: params[:email])
    if member && member.authenticated?(:invitation, params[:id])
      puts "Member authenticated"
      # Check if someone is logged in already
      # If logged in member differs from the invited member,
      # log out current member and log in new member
      if current_member && !current_member?(member)
        puts "Logging out #{current_member.name}."
        log_out
      end
      message = "Welcome #{member.name}!"
      puts "Invitation accepted by '#{member.name}, <#{member.email}>'"
      # Choose password if not already activated
      if member.activated?
        # Prompt for password
        redirect_to login_path
      else
        puts "Logging in #{member.name}"
        log_in member
        # Let user choose a password
        if params[:set_password]
          redirect_to edit_member_path member, set_password: true
        else
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
      flash[:danger] = "There is something wrong with the Activation link."
      redirect_to root_path
    end
  end

end
