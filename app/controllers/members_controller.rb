class MembersController < ApplicationController

  before_action :logged_in_member
  before_action :admin_member, only: [:new, :create, :destroy]

  # /members/new
  def new
    @member = Member.new
  end

  # Create Member and send invitation email.
  def create
    @member = Member.new(member_params)
    if @member.save
      # Member saved to db
      @member.send_invitation_email
      flash[:info] = "Invitation email sent to #{@member.name}."
      redirect_to root_path
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

  private
    # Strong params
    def member_params
      params.require(:member).permit(:name, :email, :joined_at, :left_at)
    end

end
