class TransactionsController < ApplicationController

  before_action :logged_in_member
  before_action :must_be_admin, only: [:new, :index, :create, :create_many, :destroy]

  def new
    @transaction = Transaction.new
  end

  def create
    @transaction = Transaction.new(transaction_params)
    if @transaction.save
      puts "transaction saved"
    else
      puts "couldn't save"
    end
  end

  def create_many
    @transactions = []
    params[:transactions].each do |transaction|
      @transactions << Transaction.new(transaction.require(:transaction).permit(:message, :amount, :date))
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

end
