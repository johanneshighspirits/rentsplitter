class RentDiscountsController < ApplicationController

  def new
    @projects = current_member.projects
    @message = params[:message]
  end

  def create
    @project = Project.find(params[:project_id])
    @project.rent_discounts.build(rent_discount_params)
    if @project.save
      flash[:info] = "Rent Discount saved"
    else
      flash[:danger] = "Something is wrong..."
    end
    redirect_to rent_discounts_path
  end

  private
    def rent_discount_params
      params.require(:rent_discount).permit(:message, :amount, :transferred_at)
    end

end
