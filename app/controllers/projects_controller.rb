class ProjectsController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:for_member]

  def index
    if logged_in?
      render html: "Choose a project from #{current_member.projects}"
    else
      redirect_to root_path
    end
  end

  def for_member
    projects_for_member = Member.find(params[:id]).projects.map { |p| [p.id, p.name] }
    render json: projects_for_member
  end

end
