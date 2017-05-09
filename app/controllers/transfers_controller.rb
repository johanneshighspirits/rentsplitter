class TransfersController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :create, :create_many, :destroy]

  def new
    @transfer = Transfer.new
    @members = Member.all
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

  # Returns all of Project's Transfers, grouped on its Members.
  def for_project
    # Find project
    p = Project.includes(:members, :memberships).references(:members).find(params[:id])
    # Calculate total rent to pay (from project start)
    total_rent = p.total_rent
    # Find all RentDiscounts 
    rent_discounts = p.rent_discounts.map do |d|
      discount = {
        message: d.message,
        amount: d.amount,
        transferred_at: d.transferred_at,
        from: d.transferred_at.prev_month.beginning_of_month.midnight,
        to: d.transferred_at.beginning_of_month.midnight - 1.seconds, 
      }
    end

    member_and_transfers = p.members.includes(:memberships).map do |m|
      member = {
        name: m.name,
        isMember: m.memberships.first.left_at > Date.current,
        transfers: m.transfers.order(transferred_at: :desc).map do |t|
          shortDate = "#{t.transferred_at.day}/#{t.transferred_at.month}"
          longDate = t.transferred_at.to_s(:iso8601)
          {
            message: t.message,
            amount: t.amount,
            transferred_at: t.transferred_at,
            shortDate: shortDate,
            longDate: longDate,
            isNotViewedYet: true # TODO: compare members last visit date with t.transferred_at
          }
        end
      }
    end
    render json: {
      memberTransfers: member_and_transfers,
      totalRent: total_rent,
      rentDiscounts: rent_discounts,
    }
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
