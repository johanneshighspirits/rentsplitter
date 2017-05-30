class PasswordResetsController < ApplicationController
  before_action :get_member, only: [:edit, :update]
  before_action :valid_member, only: [:edit, :update]
  before_action :check_expiration, only: [:edit, :update]

  def new
  end

  def create
    @member = Member.find_by(email: params[:password_reset][:email].downcase)
    if @member
      @member.create_reset_digest
      @member.send_password_reset_email
      puts "Password reset. Check your email for reset instructions."
      render 'application/message', locals: {
        heading: "Password reset", body: ["Check your email for reset instructions."]
      }
    else
      flash.now[:danger] = "Email adress not found"
      render 'new'
    end
  end

  def edit
  end

  def update
    if params[:member][:password].empty?
      @member.errors.add(:password, "can't be empty")
      render 'edit'
    elsif @member.update_attributes(member_params)
      log_in @member
      flash[:success] = "Password has been reset."
      redirect_to root_path
    else
      render 'edit'
    end
  end

  private
    def member_params
      params.require(:member).permit(:password, :password_confirmation)
    end

    def get_member
      @member = Member.find_by(email: params[:email])
    end

    def valid_member
      unless (@member && @member.activated? && @member.authenticated?(:reset, params[:id]))
        redirect_to root_url
      end
    end

    def check_expiration
      if @member.password_reset_expired?
        flash[:danger] = "Password reset has expired."
        redirect_to new_password_reset_path
      end
    end

end
