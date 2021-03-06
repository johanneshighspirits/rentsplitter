class TransfersController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_project_admin, only: [:new, :create, :create_many, :destroy]

  def new
    @transfer = Transfer.new
    @expense = Expense.new
    @allMembers = []
    @projects = current_member.projects.where(admin_id: current_member.id)
    @projects.each do |project|
      @allMembers = @allMembers | project.members
    end
    @allMembers.sort! { |a, b| a.name <=> b.name }
  end

  def create
    if params[:single_or_multiple] == "single"
      @project = Project.find(params[:project_id])
    elsif params[:single_or_multiple] == "multiple"
      @project = Project.find(params[:multiple_project_id])
    elsif params[:single_or_multiple] == "expense"
      @project = Project.find(params[:expense_project_id])
    end
    @members = @project.members.includes(:memberships)

    unless params[:transfers].nil?
      @transfers = []
      params[:transfers].each do |key, transfer|
        # Find member
        unless transfer[:member_id] == "0" || transfer[:ignore] == "on"
          member = @members.find(transfer[:member_id])
          if member.nil?
            puts "Couldn't find member matching '#{transfer[:message]}'"
          else
            puts "Found member match: '#{transfer[:message]}' == #{member.name}"
            # Find Membership that hold all transfers
            membership = member.memberships.where(project_id: @project.id).first
            @transfers << membership.transfers.build(transfer.permit(:message, :amount, :transferred_at))
          end
        else
          puts "Ignored '#{transfer[:message]}' because ignore = #{transfer[:ignore]} or member id = #{transfer[:member_id]}"
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

    unless params[:expenses].nil?
      @expenses = []
      params[:expenses].each do |key, expense|
        @expenses << @project.expenses.build(expense.permit(:description, :amount, :registered_at))
      end
      Expense.import @expenses, ignore: true
    end

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
  # /projects/:id/transfers
  def for_project
    # Find project
    p = Project.find(params[:id])
    # Fetch expenses
    expenses = p.expenses
    # Fetch rents and discounts
    rents_and_discounts = p.project_rents_and_discounts
    member_and_transfers = p.members.map do |m|
      membership = p.memberships.where(project_id: p.id, member_id: m.id).first
      isMember = membership.joined_at <= Date.current && membership.left_at > Date.current
      if p.start_date == membership.joined_at && membership.left_at > Date.current
        # If member is participating from the start of the project, make sure
        # isMember is true even before project start
        isMember = true
      end
      member = {
        name: m.name,
        isMember: isMember,
        isActivated: m.activated,
        isInvited: m.invited,
        joinedAt: membership.joined_at,
        leftAt: membership.left_at,
        transfers: membership.transfers.order(transferred_at: :desc).map do |t|
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
      rentAndDiscounts: rents_and_discounts,
      expenses: expenses
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
