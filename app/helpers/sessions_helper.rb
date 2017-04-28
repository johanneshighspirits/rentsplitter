module SessionsHelper

  # Log in
  def log_in(member)
    session[:member_id] = member.id
  end

  def remember(member)
    member.remember
    cookies.permanent.signed[:member_id] = member.id
    cookies.permanent[:remember_token] = member.remember_token
  end

  # Returns the current logged-in member (if any).
  def current_member
    # Check session first
    if (member_id = session[:member_id])
      @current_member ||= Member.find_by(id: member_id)
      # No session, check cookies
    elsif (member_id = cookies.signed[:member_id])
      member = Member.find_by(id: member_id)
      if member && member.authenticated?(:remember, cookies[:remember_token])
        log_in member
        @current_member = member
      end
    end
  end

  # Is member logged in?
  def logged_in?
    !current_member.nil?
  end

  def is_admin?
    current_member.admin
  end

  # Check if member is current_member
  def current_member?(member)
    member == current_member
  end

  def forget(member)
    member.forget
    cookies.delete(:member_id)
    cookies.delete(:remember_token)
  end

  # Log out current member
  def log_out
    forget(current_member)
    session.delete(:member_id)
    @current_member = nil
  end

  # Redirects to stored location (or to default)
  def redirect_back_or(default)
    redirect_to(session[:forwarding_url] || default)
    session.delete(:forwarding_url)
  end

  # Stores the URL trying to be accessed
  def store_location
    session[:forwarding_url] = request.original_url if request.get?
  end

  # Check that member is logged in
  def logged_in_member
    unless logged_in?
      flash[:danger] = "Please log in"
      redirect_to login_path
    end
  end

  # Redirect if member is not admin
  def must_be_admin
    unless is_admin?
      flash[:danger] = "You must log in as Admin to edit members"
      redirect_to root_path
    end
  end


end
