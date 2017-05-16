class TransfersController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_project_admin, only: [:new, :create, :create_many, :destroy]

  def new
    @transfer = Transfer.new
    @members = Project.find(current_project_id).members
  end

  def create
    @project = Project.find(current_project_id)
    @members = @project.members.includes(:memberships)

    unless params[:transfers].nil?
      @transfers = []
      params[:transfers].each do |key, transfer|
        # Find member
        unless transfer[:member_id] == "0"
          member = @members.find(transfer[:member_id])
          if member.nil?
            puts "Couldn't find member matching '#{transfer[:message]}'"
          else
            puts "Found member match: '#{transfer[:message]}' == #{member.name}"
            # Find Membership that hold all transfers
            membership = member.memberships.where(project_id: current_project_id).first
            @transfers << membership.transfers.build(transfer.permit(:message, :amount, :transferred_at))
          end
        end
      end
      Transfer.import @transfers, ignore: true
    end

    unless params[:rent_discounts].nil?
      @rent_discounts = []
      params[:rent_discounts].each do |key, discount|
        @rent_discounts << @project.rent_discounts.build(discount.permit(:message, :amount, :transferred_at))
      end

      RentDiscount.import @rent_discounts, ignore: true
    end

    flash[:success] = "Transactions added successfully"
    redirect_to new_transfer_path
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
#    total_rent = p.total_rent
    # Fetch rents
    rents_and_discounts = p.project_rents_and_discounts
    # Find all RentDiscounts 
    # rent_discounts = p.rent_discounts.map do |d|
    #   discount = {
    #     message: d.message,
    #     amount: d.amount,
    #     shared_amount: d.shared_amount,
    #     transferred_at: d.transferred_at,
    #     from: d.transferred_at.prev_month.beginning_of_month.midnight,
    #     to: d.transferred_at.beginning_of_month.midnight - 1.seconds, 
    #   }
    # end

    member_and_transfers = p.members.includes(:memberships).map do |m|
      member = {
        name: m.name,
        isMember: m.memberships.first.left_at > Date.current,
        joinedAt: m.memberships.first.joined_at,
        leftAt: m.memberships.first.left_at,
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
#      totalRent: total_rent,
      # rents: rents_and_discounts,
      # rentDiscounts: rents_and_discounts,
      rentAndDiscounts: rents_and_discounts,
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
