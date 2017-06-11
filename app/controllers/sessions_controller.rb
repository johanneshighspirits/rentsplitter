class SessionsController < ApplicationController

  def new
    @temp = {
      email: "",
      remember_me: true
    }
  end

  # Creating a session == Login
  def create
    @member = Member.find_by(email: params[:session][:email].downcase)
    if @member && @member.authenticate(params[:session][:password])
      if @member.activated?
        # Log in if activated
        puts "Logging in #{@member.name}"
        log_in @member
        puts "Remembering #{@member.name}? if on == #{params[:session][:remember_me]} Bool: #{params[:session][:remember_me] == 'on'}"
        params[:session][:remember_me] == 'on' ? remember(@member) : forget(@member)
        # Redirect to root
        redirect_back_or root_path
      else
        message = "Account not activated. "
        message += "Check your email for the activation link."
        flash[:danger] = message
        puts message
        redirect_to login_path
      end
    else
      # Error when logging in
      flash.now[:danger] = "Invalid email or password"
      puts "Invalid email or password"
      @temp = params[:session]
      render 'new'
    end
  end

  # Log out
  def destroy
    log_out if logged_in?
    redirect_to root_url
  end

end
