class MembershipsController < ApplicationController

  def destroy
    @membership = Membership.find(params[:id])
    puts "This will delete Membership #{@membership}. In other words, remove member #{@membership.member_id} from project #{@membership.project_id}"
    @membership.destroy
    flash[:success] = "Member removed from project"
    redirect_to members_path
  end

end
