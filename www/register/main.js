define([
    'jquery',
    '/customize/login.js',
    '/common/cryptpad-common.js',
    '/common/test.js',
    '/common/common-credential.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/hyperscript.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Login, Cryptpad, Test, Cred, UI, Util, Realtime, Constants, Feedback, LocalStore, h) {
    var Messages = Cryptpad.Messages;
    $(function () {
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        }

        // text and password input fields
        var $uname = $('#username');
        var $passwd = $('#password');
        var $confirm = $('#password-confirm');

        if (localStorage.login_user) {
            $uname.val(localStorage.login_user);
            delete localStorage.login_user;
        }

        [ $uname, $passwd, $confirm]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        // checkboxes
        var $checkImport = $('#import-recent');
        var $checkAcceptTerms = $('#accept-terms');

        var $register = $('button#register');

        var registering = false;
        var test;

        var I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = false;
        var br = function () { return h('br'); };

        var registerClick = function () {
            var uname = $uname.val().trim();
    // trim whitespace surrounding the username since it is otherwise included in key derivation
    // most people won't realize that its presence is significant
            $uname.val(uname);

            var passwd = $passwd.val();
            var confirmPassword = $confirm.val();

            var shouldImport = $checkImport[0].checked;
            var doesAccept = $checkAcceptTerms[0].checked;

            if (Cred.isEmail(uname) && !I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME) {
                var emailWarning = [
                    Messages.register_emailWarning0,
                    br(), br(),
                    Messages.register_emailWarning1,
                    br(), br(),
                    Messages.register_emailWarning2,
                    br(), br(),
                    Messages.register_emailWarning3,
                ];

                Feedback.send("EMAIL_USERNAME_WARNING", true);

                return void UI.confirm(emailWarning, function (yes) {
                    if (!yes) { return; }
                    I_REALLY_WANT_TO_USE_MY_EMAIL_FOR_MY_USERNAME = true;
                    registerClick();
                });
            }

            /* basic validation */
            if (!Cred.isLongEnoughPassword(passwd)) {
                var warning = Messages._getKey('register_passwordTooShort', [
                    Cred.MINIMUM_PASSWORD_LENGTH
                ]);
                return void UI.alert(warning, function () {
                    registering = false;
                });
            }

            if (passwd !== confirmPassword) { // do their passwords match?
                return void UI.alert(Messages.register_passwordsDontMatch);
            }

            if (!doesAccept) { // do they accept the terms of service?
                return void UI.alert(Messages.register_mustAcceptTerms);
            }

            setTimeout(function () {
                var span = h('span', [
                    h('h2', [
                        h('i.fa.fa-warning'),
                        ' ',
                        Messages.register_warning,
                    ]),
                    Messages.register_warning_note
                ]);

            UI.confirm(span,
            function (yes) {
                if (!yes) { return; }

                Login.loginOrRegisterUI(uname, passwd, true, shouldImport, Test.testing, function () {
                    if (test) {
                        localStorage.clear();
                        test.pass();
                        return true;
                    }
                });
                registering = true;
            }, {
                ok: Messages.register_writtenPassword,
                cancel: Messages.register_cancel,
/*  If we're certain that we aren't using these "*Class" APIs
    anywhere else then we can deprecate them and make this a
    custom modal in common-interface (or here).  */
                cancelClass: 'btn.btn-cancel.btn-register',
                okClass: 'btn.btn-danger.btn-register',
                reverseOrder: true,
                done: function ($dialog) {
                    $dialog.find('> div').addClass('half');
                },
            });
            }, 150);
        };

        $register.click(registerClick);

        var clickRegister = Util.notAgainForAnother(function () {
            $register.click();
        }, 500);

        $register.on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                e.stopPropagation();
                return clickRegister();
            }
        });

        Test(function (t) {
            test = t;
            $uname.val('testuser');
            $passwd.val('testtest');
            $confirm.val('testtest');
            $checkImport[0].checked = true;
            $checkAcceptTerms[0].checked = true;
            $register.click();

            window.setTimeout(function () {
                UI.findOKButton().click();
            }, 1000);
        });
    });
});
