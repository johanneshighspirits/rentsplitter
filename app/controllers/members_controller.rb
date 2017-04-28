class MembersController < ApplicationController

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
  end

  # ADMIN ONLY:
  # Creating a new Member, saves to db and sends invitation email.
  # post /members
  def create
    # Convert month/year params to date
    params[:joined_at] = "#{params[:joined_at_y]}-#{params[:joined_at_m]}-1".to_date
    params[:left_at] = "#{params[:left_at_y]}-#{params[:left_at_m]}-1".to_date.end_of_month
    @member = Member.new(member_params)
    if @member.save
      # Member saved to db
      @member.send_invitation_email
      flash[:info] = "Invitation email sent to #{@member.email}."
      redirect_to root_path
    else
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
  end

  private
    # Strong params
    def member_params
      params.require(:member).permit(:name, :email, :password, :password_confirmation, :joined_at, :left_at)
    end

end
