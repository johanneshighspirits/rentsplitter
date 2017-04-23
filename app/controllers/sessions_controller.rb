class SessionsController < ApplicationController

  def new
  end

  # Creating a session == Login
  def create
    @member = Member.find_by(email: params[:session][:email].downcase)
    if @member && @member.authenticate(params[:session][:password])
      if @member.activated?
        # Log in if activated
        puts "Logging in"
        log_in @member
        params[:session][:remember_me] == '1' ? remember(@member) : forget(@member)
        # Redirect to admin pages if admin, else root
        if @member.admin
          # Redirect to wanted url if admin, else members
          puts "Admin. Redirecting to #{session[:forwarding_url]} or #{members_path}"
          redirect_back_or members_path
        else
          puts "Not admin, redirect to root"
          redirect_to root_path
        end
      else
        message = "Account not activated. "
        message += "Check your email for the activation link."
        flash[:warning] = message
        puts message
        redirect_to root_url
      end
    else
      # Error when logging in
      flash.now[:danger] = "Invalid email or password"
      render 'new'
    end
  end

  # Log out
  def destroy
    log_out if logged_in?
    redirect_to root_url
  end

end
