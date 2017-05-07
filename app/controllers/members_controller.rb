class MembersController < ApplicationController

  include ProjectsHelper
  include SessionsHelper

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :index, :create, :destroy]

  # ADMIN ONLY:
  # List all members. Edit or Delete.
  # /members
  def index
    @members = Member.all
  end

  # ADMIN ONLY:
  # Create new member
  # /members/new
  def new
    @member = Member.new
    @projects = Project.all
  end

  # ADMIN ONLY:
  # Creating a new Member, connects to an existing Project (through Membership) or
  # creates a new one. Saves member to db and sends invitation email.
  # post /members
  def create
    # Convert month/year params to date
    params[:joined_at] = "#{params[:joined_at_y]}-#{params[:joined_at_m]}-1".to_date
    params[:left_at] = "#{params[:left_at_y]}-#{params[:left_at_m]}-1".to_date.end_of_month
    # Init Member
    @member = Member.new(member_params)
    # if @member.save
      # Member saved to db
      # Choose an existing project or create a new?
    if params[:new_or_existing] == "new" && !params[:project][:name].blank?
      # Admin wants to create a new project
      project_name = params[:project][:name]
      puts "Will create new Project: '#{project_name}'"
      # Create project
      puts "Assign project '#{project_name}' to member '#{@member.name}"
      @member.projects.build(project_params)
    elsif params[:new_or_existing] == "existing" && params[:project_id] != "0"
      # Add member to existing project
      puts "Assign project with id '#{params[:project_id]}' to member '#{@member.name}"
      existing_project = Project.find(params[:project_id])
      project_name = existing_project.name
      @member.projects << existing_project
    else
      flash[:danger] = "Enter a name for a new Project or choose an existing one."
      puts "Enter a name for a new Project or choose an existing one."
      @projects = Project.all
      render 'new' and return
    end

    # Save member (along with project) to database
    puts "Saving member #{@member.name} to db"
    if @member.save
      project = @member.projects.find_by(name: project_name)
      project.rents.create(amount: params[:monthly_rent])

      # Member saved to db. Send invitiation email.
      @member.send_invitation_email sender: current_member, project_name: project_name
      flash[:info] = "Invitation email sent to #{@member.email} from #{current_member.name}. Invited to project #{project_name}."
      set_current_project_id Project.find_by(name: project_name).id
      redirect_to root_path
    else
      flash[:danger] = "#{@member.name} could not be saved."
      @projects = Project.all
      render 'new'
    end
  end

  def edit
    @member = Member.find(params[:id])
    if params[:first]
      render 'members/edit_password' and return
    end
  end

  def update
    @member = Member.find(params[:id])
    if @member.update_attributes(member_params)
      if is_admin?
        flash[:success] = "Member updated"
        redirect_to @member
      else
        flash[:success] = "Password updated"
        # Activate member if not already activated
        unless @member.activated?
          @member.update_attribute(:activated, true)
          flash[:success] += "Your account has been activated."
          puts "Account activated for '#{@member.name}, <#{@member.email}>'"
        end
        remember @member
        redirect_to root_path
      end
    else
      render 'edit'
    end
  end

  # ADMIN ONLY:
  # Deleting a Member
  # delete /members/id
  def destroy
    # Maybe this shouldn't be allowed if member has transactions?
    # Since calculations are based on all transactions from the
    # beginning of time, deleting a member's transactions would
    # impact the other members' debts...
  end

  private
    # Strong params
    def member_params
      params.require(:member).permit(:name, :email, :password, :password_confirmation, :joined_at, :left_at, :current_project_id)
    end

end
