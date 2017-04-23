class InvitationsController < ApplicationController

  def edit
    member = Member.find_by(email: params[:email])
    if member && !member.activated? && member.authenticated?(:invitation, params[:id])
      member.update_attribute(:activated, true)
      log_in member
      flash[:success] = "Account activated!"
      puts "Account activated for #{member.email}"
    end
    redirect_to root_url
  end

end
