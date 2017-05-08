class ProjectsController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:for_member]

  def index
    if logged_in?
      @projects = current_member.projects
    else
      redirect_to root_path
    end
  end

  def new
    @project = Project.new
  end

  def create
    @project = Project.new(project_params)
  end

  def edit
  end

  def show
    current_member.open_project params[:id]
    redirect_to root_path
  end

  def for_member
    projects_for_member = Member.find(params[:id]).projects.map { |p| [p.id, p.name] }
    render json: projects_for_member
  end


end
