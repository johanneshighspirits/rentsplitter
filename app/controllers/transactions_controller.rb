class TransactionsController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :create, :create_many, :destroy]

  def new
    @transaction = Transaction.new
    @members = Member.all
  end

  def create
    @member = Member.find(params[:member_id])
    @transaction = @member.transactions.build(transaction_params)
    if @transaction.save
      flash[:success] = "Transaction successfully saved!"
    else
      flash[:danger] = "The transaction could not be saved. Check your input."
    end
    redirect_to new_transaction_path
  end

  def create_many
    @members = Member.all
    @transactions = []
    params[:transactions].each do |transaction|
      # Find member
      member = member_for transaction[:transaction][:message]
      if member.nil?
        puts "Couldn't find member matching '#{transaction[:transaction][:message]}'"
      else
        puts "Found match: #{member.name}"
        @transactions << member.transactions.build(transaction.require(:transaction).permit(:message, :amount, :date))
      end
    end
    Transaction.import @transactions
  end

  def index
    if logged_in?
      @transactions = Transaction.all
      render json: @transactions
    else
      redirect_to root_path
    end
  end

  private

    def transaction_params
      params.require(:transaction).permit(:amount, :message, :date)
    end

    # Returns the Member whose pattern matches the provided message
    # Use this to find which Member has made an unknown transaction
    def member_for(message)
      @members.find { |m| /#{m.pattern}/i =~ message }
    end

end
