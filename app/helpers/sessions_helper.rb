module SessionsHelper

  # Log in
  def log_in(member)
    session[:member_id] = member.id
    set_current_project_id member.current_project_id
    puts "Logging #{member.name} in, with current_project_id: #{current_project_id}"
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

  def current_project_name
    if Project.exists?(current_project_id)
      Project.find(current_project_id).name
    else
      ""
    end
  end

  # Returns the current logged-in member's current open Project id
  def current_project_id
    session[:project_id]
  end

  def set_current_project_id(p_id)
    if Project.exists?(p_id)
      session[:project_id] = p_id
      current_member.open_project p_id
    else
      session[:project_id] = 0
    end
  end

  # Is current logged in member the admin of the currently open project
  def project_admin?
    member_projects = current_member.projects.where(id: current_project_id)
    return false if member_projects.empty?
    current_member.id == member_projects.first.admin_id
  end

  # Is member logged in?
  def logged_in?
    !current_member.nil?
  end

  def is_site_admin?
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
    session.delete(:project_id)
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
    puts "logged_in_member #{logged_in?}"
    unless logged_in?
      flash[:danger] = "Please log in"
      store_location
      redirect_to login_path
    end
  end

  # Redirect if member is not admin
  def must_be_site_admin
    unless is_site_admin?
      flash[:danger] = "This page is restricted to Site Admin."
      redirect_to root_path
    end
  end

  def must_be_project_admin
    unless project_admin?
      flash[:danger] = "Access denied. Project admin only."
      redirect_to root_path 
    end
  end


end
