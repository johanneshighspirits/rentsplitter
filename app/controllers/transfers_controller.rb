class TransfersController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :create, :create_many, :destroy]

  def new
    @transfer = Transfer.new
    @members = Member.all
    # TODO Fetch only members projects, when selected
    # in dropdown list (transfers/new)
    @projects = Project.all
  end

  def create
    @member = Member.find(params[:member_id])
    project_id = params[:project_id]
    # Find Membership that hold all transfers
    membership = @member.memberships.where(project_id: project_id).first
    p membership
    puts "Member: #{membership.member_id}"
    puts "Project: #{membership.project_id}"
    puts "Transfers: #{membership.transfers}"
    @transfer = membership.transfers.build(transfer_params)
    if @transfer.save
      flash[:success] = "Transfer successfully saved!"
    else
      flash[:danger] = "The transfer could not be saved. Check your input."
    end
    redirect_to new_transfer_path
  end

  def create_many
    @members = Member.all
    @transfers = []
    params[:transfers].each do |transfer|
      # Find member
      member = member_for transfer[:transfer][:message]
      if member.nil?
        puts "Couldn't find member matching '#{transfer[:transfer][:message]}'"
      else
        # Find Membership that hold all transfers
        membership = member.memberships.where(project_id: member.current_project_id).first
        @transfers << membership.transfers.build(transfer.require(:transfer).permit(:message, :amount, :transferred_at))
      end
    end
    Transfer.import @transfers
  end

  def index
    if logged_in?
      @transfers = Transfer.all
      render json: @transfers
    else
      redirect_to root_path
    end
  end

  private

    def transfer_params
      params.require(:transfer).permit(:amount, :message, :transferred_at)
    end

    # Returns the Member whose pattern matches the provided message
    # Use this to find which Member has made an unknown transfer
    def member_for(message)
      @members.find { |m| /#{m.pattern}/i =~ message }
    end

end