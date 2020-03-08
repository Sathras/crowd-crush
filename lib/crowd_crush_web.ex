defmodule CrowdCrushWeb do
  @moduledoc """
  A module that keeps using definitions for controllers,
  views and so on.

  This can be used in your application as:

      use CrowdCrushWeb, :controller
      use CrowdCrushWeb, :view

  The definitions below will be executed for every view,
  controller, etc, so keep them short and clean, focused
  on imports, uses and aliases.

  Do NOT define functions inside the quoted expressions
  below.
  """

  def controller do
    quote do
      use Phoenix.Controller, namespace: CrowdCrushWeb

      import Phoenix.LiveView.Controller
      import Plug.Conn
      import CrowdCrushWeb.Gettext

      alias CrowdCrushWeb.Router.Helpers, as: Routes
    end
  end

  def view do
    quote do
      use Phoenix.HTML
      use Phoenix.View, root: "lib/crowd_crush_web/templates", namespace: CrowdCrushWeb

      import Phoenix.HTML.Form, except: [select: 4, text_input: 3, url_input: 3]
      import Phoenix.Controller, only: [get_flash: 1, get_flash: 2]
      import Phoenix.LiveView.Helpers

      import CrowdCrushWeb.ViewHelpers
      import CrowdCrushWeb.{ErrorHelpers, Gettext, ViewHelpers}

      alias CrowdCrushWeb.Router.Helpers, as: Routes
    end
  end

  def router do
    quote do
      use Phoenix.Router

      import Phoenix.LiveView.Router
      import Plug.Conn
      import Phoenix.Controller
      # import CrowdCrushWeb.Auth, only: [authenticate_user: 2]
    end
  end

  def channel do
    quote do
      use Phoenix.Channel

      import CrowdCrushWeb.{ErrorHelpers, Gettext}
      import CrowdCrushWeb.UserSocket, except: [connect: 2, id: 1]

      alias Phoenix.View
      alias CrowdCrush.Simulation
      alias CrowdCrushWeb.Endpoint
    end
  end

  @doc """
  When used, dispatch to the appropriate controller/view/etc.
  """
  defmacro __using__(which) when is_atom(which), do: apply(__MODULE__, which, [])
end
