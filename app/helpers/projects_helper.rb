module ProjectsHelper
  def project_params
    params.require(:project).permit(:name, :start_date, :admin_id)
  end
end
