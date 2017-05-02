class ProjectsController < ApplicationController

  def index
    if logged_in?
      render html: "Choose a project from #{current_member.projects}"
    else
      redirect_to root_path
    end
  end

end
