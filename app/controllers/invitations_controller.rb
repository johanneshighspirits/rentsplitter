class InvitationsController < ApplicationController

  # Member clicked on invitation link, thereby accepting the invitation
  # /invitations/<token>/edit?email=<url escaped email address>
  def edit
    member = Member.find_by(email: params[:email])
    # Check if someone is logged in already
    # If logged in member differs from the invited member,
    # log out current member and log 
    if current_member && !current_member?(member)
      log_out
      puts "Logging out #{current_member.name}."
    end
    if member && member.authenticated?(:invitation, params[:id])
      message = "Welcome #{member.name}!"
      puts "Invitation accepted by '#{member.name}, <#{member.email}>'"
      # Activate member if not already activated
      unless member.activated?
        member.update_attribute(:activated, true)
        message += "Your account has been activated."
        puts "Account activated for '#{member.name}, <#{member.email}>'"
      end
      log_in member
      remember member
      flash[:success] = message
    end
    redirect_to root_url
  end

end
