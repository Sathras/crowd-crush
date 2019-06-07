defmodule CrowdCrushWeb.SessionsController do
  use Phoenix.Controller

  alias CrowdCrushWeb.Auth

  def create(conn, %{"session" => %{"email" => email, "password" => pass}}) do
    case Auth.login_by_email_and_pass(conn, email, pass) do
      {:ok, conn} ->

        render conn, "show.json",
          user: conn.assigns.current_user,
          user_token: conn.assigns.user_token

      {:error, _reason, conn} ->
        conn
        |> put_status(:unauthorized)
        |> render("error.json")
    end
  end

  def delete(conn, _params) do
    conn
    |> Auth.logout()
    |> send_resp(:ok, "logged out.")
    |> halt()
  end

  def unauthenticated(conn, _params) do
    conn
    |> put_status(:forbidden)
    |> render(CrowdCrushWeb.SessionsView, "forbidden.json", error: "Not Authenticated!")
  end
end
