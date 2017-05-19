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
    new_project = current_member.projects.build(project_params)
    if current_member.save
      # Set join and left dates
      membership = current_member.memberships.where(project_id: new_project.id).first
      membership.joined_at = new_project.start_date
      membership.left_at = 100.years.from_now
      membership.save
      if new_project.reload.rents.empty?
        new_project.rents.create(amount: params[:monthly_rent], due_date: new_project.start_date.change(day: 25))
      end
      flash[:success] = "'#{new_project.name}' successfully created."
      # Open new Project
      set_current_project_id new_project.id
      # Invite/add members
      redirect_to invite_path
    else
      flash[:danger] = "Could not save new Project."
      @project = Project.new
      redirect_to new_project_path
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
