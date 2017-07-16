class MembersController < ApplicationController

  include ProjectsHelper
  include SessionsHelper

  before_action :logged_in_member, except: [:new, :create, :activate]
  # before_action :must_be_site_admin, only: [:destroy]
  before_action :must_be_project_admin, only: [:index, :destroy]

  # PROJECT ADMIN ONLY:
  # List all members. Edit or Delete.
  # /members
  def index
    @project = Project.find(current_project_id)
    @members = @project.members
  end

  def show
    @member = Member.find(params[:id])
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
    @member.invited = true
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
    # Find all members that current member has invited.
    # Only show members that belongs to project that current_member
    # is admin for
    @members = []
    @projects.each do |p|
      if p.admin_id == current_member.id
        p.members.each do |m|
          @members << m
        end
      end
    end
    @members.uniq!
  end

  # MEMBER ONLY:
  # Creating a new Member, connects to an existing Project (through Membership) or
  # creates a new one. Saves member to db and sends invitation email.
  # post /invite
  def create_and_invite
    puts "MembersController#create_and_invite"
    # Convert month/year params to date
    params[:joined_at] = "#{params[:joined_at_y]}-#{params[:joined_at_m]}-1".to_date
    # Left_at should be the first of next month. A member who's left_at is set to 1st of August will
    # only pay for July.
    params[:left_at] = "#{params[:left_at_y]}-#{params[:left_at_m]}-1".to_date.next_month #.end_of_month
    
    # Invite a new member or add an existing to a project
    if params[:invite_or_add] == "add"
      # Add to existing project
      @member = Member.find(params[:member][:id])
      # Add member to existing project
      existing_project = Project.find(params[:project_id])
      puts "Assign project '#{existing_project.name}' (#{params[:project_id]}) with admin #{existing_project.admin_id}, to member '#{@member.name}'."
      project_name = existing_project.name
      if existing_project.admin_id == current_member.id
        # Make sure that current member is admin of the project.
        @member.projects << existing_project
        membership = @member.memberships.where("project_id = ?", existing_project.id)
        membership.update(joined_at: params[:joined_at], left_at: params[:left_at])
        @member.save
        
        # Member saved to db. Send invitiation email.
        if params[:send_invitation]
          @member.send_invitation_email sender: current_member, project: existing_project
          flash[:info] = "Invitation email sent to #{@member.email} from #{current_member.name}. Invited to project #{existing_project.name}."
        end

        set_current_project_id existing_project.id
        redirect_to root_path and return
      else
        cancel_invite "NOT PROJECT ADMIN. Member #{current_member.id} is not #{existing_project.admin_id}."
        return false
      end
    else
      # Create new and add to existing/newly created project
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
          if current_member.projects.where("admin_id = ? AND name = ?", current_member.id, project_name).empty?
            # Member is not the admin of a project with this name, create it
            puts "Will create new Project: '#{project_name}'"
            # Create project
            puts "Assign project '#{project_name}' to member '#{@member.name}"
            puts "Assign project admin privileges to current member '#{current_member.name}"
            current_member.projects.build(project_params)
            current_member.save
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
            @member.projects << existing_project
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
        @member.current_project_id = params[:project_id]
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
        if params[:send_invitation]
          @member.send_invitation_email sender: current_member, project: project
          flash[:info] = "Invitation email sent to #{@member.email} from #{current_member.name}. Invited to project #{project_name}."
        end
        set_current_project_id project.id
        redirect_to root_path
      else
        flash[:danger] = "#{@member.name} could not be saved."
        p @member.errors.messages
        @projects = current_member.projects.where(admin_id: current_member.id)
        render 'invite'
      end
    end

  end

  def edit
    @member = Member.find(params[:id])
    if params[:set_password]
      session[:set_password] = true
      render 'members/edit_password'
    else
      render 'members/welcome'
    end
  end

  def update
    @member = Member.find(params[:id])
    if @member.update_attributes(member_params)
      if session[:set_password]
        # Member has been invited and has now accepted the
        # invitation and chosen a password.
        flash[:success] = "Password updated"
        # Activate member if not already activated
        unless @member.activated?
          @member.update_attribute(:activated, true)
          flash[:success] += "Your account has been activated."
          puts "Account activated for '#{@member.name}, <#{@member.email}>'"
        end

        remember @member
        redirect_to root_path and return
      elsif params[:member][:edited_by] == "admin"
        # Member has been edited by project admin
        flash[:success] = "Profile for '#{@member.name}' updated"
        redirect_to members_path and return
      else
        # Member has been edited by itself
        flash[:success] = "Your profile has been updated."
        redirect_to edit_member_path @member and return
      end
    else
      flash[:success] = "Errors: #{@member.errors}"
      render 'edit'
    end
  end
  
  # ADMIN ONLY
  # Edit membership (join and left dates)
  def 
  

  # ADMIN ONLY:
  # Deleting a Member
  # delete /members/:id
  def destroy
    # Maybe this shouldn't be allowed if member has transactions?
    # Since calculations are based on all transactions from the
    # beginning of time, deleting a member's transactions would
    # impact the other members' debts...
    Member.find(params[:id]).destroy
    flash[:success] = "Deleted"
    redirect_to members_path
  end

  private
    # Strong params
    def member_params
      params.require(:member).permit(:first_name, :last_name, :email, :pattern, :password, :password_confirmation, :current_project_id)
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
