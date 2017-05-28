module ProjectsHelper
  def project_params
    params.require(:project).permit(:name, :start_date, :admin_id, :account_info)
  end

  def is_admin_for_project?(project)
    current_member.id == project.admin_id
  end
end
