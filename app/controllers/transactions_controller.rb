class TransactionsController < ApplicationController

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
