<template>
  <v-app>
    <v-card flat>
      <v-toolbar
        :color="connected ? 'primary' : 'red'"
        dark
        :extended="$vuetify.breakpoint.mdAndUp"
      >
        <v-toolbar-side-icon></v-toolbar-side-icon>
        <v-toolbar-title class="white--text">P4wnP1 by D0minikt</v-toolbar-title>
      </v-toolbar>

      <v-layout row pb-2 style="background: #f1f1f1">
        <v-flex md6 offset-md3>
          <v-card class="card--flex-toolbar">
            <v-toolbar class="toolbar--actions" card prominent>
              <v-toolbar-title class="body-2 grey--text">DuckyScript</v-toolbar-title>

              <v-spacer></v-spacer>

              <v-btn icon @click="onRun()" :disabled="code === ''">
                <v-icon>play_arrow</v-icon>
              </v-btn>

              <v-btn icon @click="openNewSnippetDialog()" :disabled="code === ''">
                <v-icon>star_outline</v-icon>
              </v-btn>

              <v-btn icon @click="onClear()" :disabled="code === ''">
                <v-icon>clear</v-icon>
              </v-btn>
            </v-toolbar>

            <v-divider></v-divider>

            <v-card-text style="padding: 0">
              <codemirror v-model="code" :options="cmOptions"></codemirror>
            </v-card-text>
          </v-card>

          <v-card style="margin-top: 50px">
            <v-list avatar subheader>
              <v-subheader>Favourites</v-subheader>
              <v-divider />
              <template v-for="(item, key) in snippets">
                <v-list-tile v-ripple style="cursor: pointer" :key="key" @click="code = item">
                  <v-list-tile-avatar>
                    <v-icon>code</v-icon>
                  </v-list-tile-avatar>
                  <v-list-tile-content>
                    <v-list-tile-title>{{key}}</v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <v-btn icon @click.native="openDeleteSnippetDialog(key)">
                      <v-icon color="grey darken-1">
                        delete
                      </v-icon>
                    </v-btn>
                </v-list-tile-action>
                </v-list-tile>
                <v-divider :key="key+'-divider'"/>
              </template>
            </v-list>
          </v-card>
        </v-flex>
      </v-layout>
    </v-card>

    <v-snackbar
      v-model="snackbar"
      :bottom="true"
      :timeout="4000"
    >
      Code cleared
      <v-btn
        color="pink"
        flat
        @click="undoClear()"
      >
        Undo
      </v-btn>
    </v-snackbar>

    <v-snackbar
      v-model="responseSnackbar"
      :bottom="true"
      :timeout="6000"
      :color="responseSnackbarSuccess ? 'teal darken-3' : 'red darken-3'"
    >
      {{response}}
      <v-btn
        color="white"
        flat
        @click="responseSnackbar = false"
      >
        Dismiss
      </v-btn>
    </v-snackbar>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title><span class="headline">Create a Snippet</span></v-card-title>
        <v-text-field style="margin: 14px"
          v-model="dialogName"
          label="Name"
        ></v-text-field>
        <v-card-actions>
          <v-spacer />
          <v-btn flat @click.native="dialog = false; dialogName = ''">Cancel</v-btn>
          <v-btn color="primary" :disabled="dialogName === ''" @click.native="saveSnippet()">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="300px">
      <v-card>
        <v-card-title><span class="headline">Unsave Snippet</span></v-card-title>
        <v-card-text>Are you sure you would like to unsave this snippet?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn flat @click.native="deleteDialog = false">No</v-btn>
          <v-btn color="primary" @click.native="onUnsaveSnippet()">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-app>
</template>

<style lang="scss">
@media screen and (min-width: 960px) {
  .card--flex-toolbar {
    margin-top: -64px;
  }
}
.toolbar--actions {
  button * {
    color: #666;
  }
}
.application--wrap {
  background: #f1f1f1;
}
</style>

<script>
import "./ducky";

export default {
  data() {
    return {
      connected: true,

      deleteDialog: false,
      deleteDialogIndex: -1,

      dialog: false,
      dialogName: "",
      dialogIndex: -1,

      oldCode: "",
      code: "",

      snackbar: false,

      responseSnackbar: false,
      responseSnackbarSuccess: true,
      response: "posted",

      cmOptions: {
        tabSize: 2,
        mode: "ducky",
        lineNumbers: true,
        line: true
      },

      snippets: {}
    };
  },
  computed: {},
  beforeMount() {
    this.updateStatus();
    setInterval(() => {
      this.updateStatus();
    }, 10000);
  },
  mounted() {
    document.body.addEventListener("keydown", e => {
      if (e.ctrlKey && e.key == "Enter" && this.code !== "") {
        e.preventDefault();
        this.onRun();
      }
      if (e.ctrlKey && e.key == "s") {
        e.preventDefault();
        if (this.code !== "") this.openNewSnippetDialog();
      }
    });
  },
  methods: {
    updateStatus() {
      this.$http.get("/data").then(
        resp => {
          this.connected = true;
          this.updateData(resp.body);
        },
        resp => {
          this.connected = false;
        }
      );
    },
    onClear() {
      this.snackbar = true;
      this.oldCode = this.code;
      this.code = "";
    },
    onRun() {
      this.$http
        .post("/exec/ducky", { code: this.code })
        .then(
          resp => {
            this.notify("Script Executed");
          },
          resp => {
            console.log(resp);
            if (resp.status == 401) this.notify(resp.body, false);
            else this.notify("Error executing script", false);
          }
        );
    },
    undoClear() {
      this.code = this.oldCode;
    },
    unsaveSnippet() {},
    saveSnippet() {
      let snippet = this.code;
      let name = this.dialogName;

      this.dialog = false;
      this.dialogName = "";

      const before = Object.assign({}, this.snippets);
      this.snippets[name] = snippet;

      this.$http
        .put(`/scripts/ducky/${name}`, {
          code: snippet
        })
        .then(
          resp => {},
          resp => {
            this.snippets = before;
          }
        );
    },
    openNewSnippetDialog() {
      this.dialog = true;
    },
    onUnsaveSnippet() {
      this.deleteDialog = false;

      const before = Object.assign({}, this.snippets);
      delete this.snippets[this.deleteDialogIndex];

      this.$http
        .delete(
          `/scripts/ducky/${this.deleteDialogIndex}`,
          { code: "" }
        )
        .then(
          resp => {
            this.updateData(resp.body);
          },
          resp => {
            console.log(resp);
            this.snippets = before;
          }
        );
    },
    openDeleteSnippetDialog(index) {
      this.deleteDialog = true;
      this.deleteDialogIndex = index;
    },
    updateData(data) {
      this.snippets = data.scripts.ducky;
    },
    notify(message, success = true) {
      this.response = message;
      this.responseSnackbar = true;
      this.responseSnackbarSuccess = success;
    }
  }
};
</script>