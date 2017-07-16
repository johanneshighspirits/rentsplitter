class MembershipsController < ApplicationController

  def update
    @membership = Membership.find(params[:id])
    p params
    puts "======"
    p @membership
    joined_at = "#{params[:joined_at_y]}-#{params[:joined_at_m]}-1".to_date
    left_at = "#{params[:left_at_y]}-#{params[:left_at_m]}-1".to_date.next_month

    if @membership.joined_at != joined_at
      @membership.update(joined_at: joined_at)
      puts "Joined at updated"
    end
    if @membership.left_at != left_at
      @membership.update(left_at: left_at)
      puts "Left at updated"
    end
    if @membership.save
      puts "Membership changes saved"
    end
    redirect_to members_path
  end
  
  def destroy
    @membership = Membership.find(params[:id])
    puts "This will delete Membership #{@membership}. In other words, remove member #{@membership.member_id} from project #{@membership.project_id}"
    @membership.destroy
    flash[:success] = "Member removed from project"
    redirect_to members_path
  end

end
