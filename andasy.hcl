# andasy.hcl app configuration file generated for hr-employees-management-fn on Monday, 16-Mar-26 15:14:37 SAST
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "hr-employees-management-fn"

app {

  env = {
    HOST = "::"
  }

  port = 3000

  primary_region = "fsn"

  compute {
    cpu      = 1
    memory   = 256
    cpu_kind = "shared"
  }

  process {
    name = "hr-employees-management-fn"
  }

}
