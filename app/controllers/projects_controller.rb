class ProjectsController < ApplicationController

  include SessionsHelper
  include ProjectsHelper

  before_action :logged_in_member

  def index
    @projects = current_member.projects
  end

  def new
    @project = Project.new
  end

  def create
    @project = Project.new(project_params)
    if @project.save!
      flash[:success] = "'#{@project.name}' successfully created. Let's add some members..."
      # Open new Project
      set_current_project_id @project.id
      # Invite/add members
      redirect_to invite_path
    end
  end

  def edit
  end

  def show
    current_member.open_project params[:id]
    redirect_to root_path
  end

  def destroy
    @project = Project.find(params[:id])
    if is_admin_for_project? @project
      flash[:success] = "#{@project.name} deleted"
      @project.destroy
    else
      flash[:danger] = "Only members with admin privileges can delete projects."
    end
      redirect_to projects_path
  end

  def for_member
    projects_for_member = Member.find(params[:id]).projects.map { |p| [p.id, p.name] }
    render json: projects_for_member
  end


end
