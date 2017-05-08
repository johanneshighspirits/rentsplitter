class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  include SessionsHelper

  def index
    if logged_in?
      puts "Logged in as #{current_member.name}"
      set_current_project_id current_member.current_project_id
      if current_project_id == 0
        # Member is not associated with a Project
        redirect_to projects_path
      else
        @current_project = Project.find(current_project_id)
      end
    else
      redirect_to login_path
    end
  end

end
