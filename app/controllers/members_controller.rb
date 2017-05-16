class MembersController < ApplicationController

  include ProjectsHelper
  include SessionsHelper

  before_action :logged_in_member, except: [:new, :create, :activate]
  before_action :must_be_site_admin, only: [:index, :destroy]

  # SITE ADMIN ONLY:
  # List all members. Edit or Delete.
  # /members
  def index
    @members = Member.all
  end

  # Sign up:
  # /signup
  def new
    @member = Member.new
  end

  # Add Member to database
  # post /signup
  def create
    # Init Member
    @member = Member.new(member_params)
    if @member.save
      flash[:info] = "Registration successful!"
      @member.send_activation_email
      render 'activate'
    else
      render 'new'
    end
  end

  def activate
    redirect_to params[:activation_link]
  end

  # MEMBER ONLY:
  # Invite someone else:
  # /invite
  def invite
    @member = Member.new
    @projects = current_member.projects.where(admin_id: current_member.id)
  end

  # MEMBER ONLY:
  # Creating a new Member, connects to an existing Project (through Membership) or
  # creates a new one. Saves member to db and sends invitation email.
  # post /invite
  def create_and_invite
    puts "create_and_invite"
    # Convert month/year params to date
    params[:joined_at] = "#{params[:joined_at_y]}-#{params[:joined_at_m]}-1".to_date
    params[:left_at] = "#{params[:left_at_y]}-#{params[:left_at_m]}-1".to_date.end_of_month
    # Init Member
    @member = Member.new(member_params)
    if @member.save
      # Saved member (along with project) to database
      puts "Saved member #{@member.name} to db."
      # Choose an existing project or create a new?
      if params[:new_or_existing] == "new" && !params[:project][:name].blank?
        # Logged in member wants to create a new project
        project_name = params[:project][:name]
        params[:project][:admin_id] = current_member.id
        if @member.projects.where("admin_id = ? AND name = ?", current_member.id, project_name).empty?
          # Member is not the admin of a project with this name, create it
          puts "Will create new Project: '#{project_name}'"
          # Create project
          puts "Assign project '#{project_name}' to member '#{@member.name}"
          @member.projects.build(project_params)
        else
          flash[:danger] = "A project named '#{project_name}' already exists. Choose another name."
          puts "A project named '#{project_name}' already exists. Choose another name."
          cancel_invite "PROJECT ALREADY EXISTS"
          return false
        end
      elsif params[:new_or_existing] == "existing" && params[:project_id] != "0"
        # Add member to existing project
        existing_project = Project.find(params[:project_id])
        p existing_project
        puts "Assign project '#{existing_project.name}' (#{params[:project_id]}) with admin #{existing_project.admin_id}, to member '#{@member.name}'."
        project_name = existing_project.name
        if existing_project.admin_id == current_member.id
          # Make sure that current member is admin of the project.
          p existing_project
          @member.projects << existing_project
          p existing_project
          p params
        else
          cancel_invite "NOT PROJECT ADMIN. Member #{current_member.id} is not #{existing_project.admin_id}."
          return false
        end
      else
        flash[:danger] = "Enter a name for a new Project or choose an existing one."
        puts "Enter a name for a new Project or choose an existing one."
        cancel_invite "NO NEW PROJECT NAME or NO PROJECT SELECTED"
        return false
      end

      @member.save

      project = @member.projects.find_by(name: project_name)
      unless project.nil?
        membership = @member.memberships.where("project_id = ?", project.id)
        membership.update(joined_at: params[:joined_at], left_at: params[:left_at])
        @member.save
        
        if project.rents.empty?
          project.rents.create(amount: params[:monthly_rent], due_date: project.start_date.change(day: 25))
        end
      end

      # Member saved to db. Send invitiation email.
      @member.send_invitation_email sender: current_member, project_name: project_name
      flash[:info] = "Invitation email sent to #{@member.email} from #{current_member.name}. Invited to project #{project_name}."
      set_current_project_id Project.find_by(name: project_name).id
      redirect_to root_path
    else
      flash[:danger] = "#{@member.name} could not be saved."
      @projects = current_member.projects.where(admin_id: current_member.id)
      render 'invite'
    end
  end

  def edit
    @member = Member.find(params[:id])
    if params[:set_password]
      render 'members/edit_password'
    else
      render 'members/welcome'
    end
  end

  def update
    @member = Member.find(params[:id])
    if @member.update_attributes(member_params)
      if is_site_admin?
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
      params.require(:member).permit(:name, :email, :password, :password_confirmation, :current_project_id)
    end

    # If member invitation goes wrong, rollback and rerender
    def cancel_invite(error)
      @projects = current_member.projects.where(admin_id: current_member.id)
      @member.destroy
      puts "Destroyed member #{@member.name}, #{error}"
      render 'invite'
      return false
    end

end
