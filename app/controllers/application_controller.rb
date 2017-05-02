class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  include SessionsHelper

  def index
    if logged_in?
      @members = Member.all
      puts "Logged in as #{current_member.name}"
      if current_project_id == 0
        # Member is not associated with a Project
        redirect_to open_project_path
      else
        @current_project = Project.find(current_project_id)
        puts "Opening #{current_member.name}'s latest project: '#{@current_project.name}'"
      end
    else
      puts "Not logged_in"
      render html: 'You need a special invitation to see this page'
    end
  end

end
