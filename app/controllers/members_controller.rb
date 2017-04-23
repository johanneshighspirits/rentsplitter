class MembersController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :create, :destroy]

  # /members
  def index
    @members = Member.all
  end

  # /members/new
  def new
    @member = Member.new
  end

  # Create Member and send invitation email.
  # post /members
  def create
    @member = Member.new(member_params)
    if @member.save
      # Member saved to db
      puts "Member saved to db"
      @member.send_invitation_email
      flash[:info] = "Invitation email sent to #{@member.email}."
      redirect_to root_path
      puts "Redirected to root path"
    else
      render 'new'
    end
  end

  def edit
    @member = Member.find(params[:id])
  end

  def update
    @member = Member.find(params[:id])
    if @member.update_attributes(member_params)
      flash[:success] = "Member updated"
      redirect_to @member
    else
      render 'edit'
    end
  end

  def destroy
  end

  private
    # Strong params
    def member_params
      params.require(:member).permit(:name, :email, :password, :password_confirmation, :joined_at, :left_at)
    end

    # Check that member is logged in
    def logged_in_member
      unless logged_in?
        flash[:danger] = "Please log in"
        redirect_to login_path
      end
    end

    # Redirect if member is not admin
    def must_be_admin
      unless is_admin?
        flash[:danger] = "You must log in as Admin to edit members"
        redirect_to root_path
      end
    end
end
