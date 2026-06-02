
    var SERVER = 'http://localhost:5000';

    function showMsg(txt, fail) {
      var box = document.getElementById('msg');
      box.textContent = txt;
      box.className = 'msg ' + (fail ? 'err' : 'ok');
      setTimeout(function() { box.textContent = ''; }, 3000);
    }

    function showTab(tab) {
      var onUsers = tab === 'users';
      document.getElementById('section-users').style.display = onUsers ? '' : 'none';
      document.getElementById('section-activities').style.display = onUsers ? 'none' : '';
      document.getElementById('tab-user-btn').className = 'tab-btn' + (onUsers ? ' active' : '');
      document.getElementById('tab-activity-btn').className = 'tab-btn' + (!onUsers ? ' active' : '');

      if (onUsers) loadUsers();
      else loadActivities();
    }

    // ── 유저 ──

    function resetUserSearch() {
      document.getElementById('user-keyword').value = '';
      loadUsers();
    }

    function loadUsers() {
      var word = document.getElementById('user-keyword').value.trim();
      var link = SERVER + '/admin/users';
      if (word) link += '?keyword=' + encodeURIComponent(word);

      fetch(link).then(function(r) {
        return r.json();
      }).then(function(result) {
        var tbl = document.getElementById('user-tbody');
        tbl.innerHTML = '';

        if (!result.success) { showMsg('유저 목록을 불러오지 못했어요', true); return; }
        if (result.data.length === 0) {
          tbl.innerHTML = '<tr><td colspan="5">결과 없음</td></tr>';
          return;
        }

        for (var i = 0; i < result.data.length; i++) {
          var u = result.data[i];
          var since = new Date(u.createdAt).toLocaleDateString('ko-KR');
          var badge = u.role === 'admin' ? '[관리자]' : '[일반]';
          var actions = '';

          if (u.role !== 'admin') {
            actions += '<button onclick="promoteUser(\'' + u._id + '\')">관리자 승격</button> ';
          } else {
            actions += '<button onclick="demoteUser(\'' + u._id + '\')">일반으로</button> ';
          }
          actions += '<button onclick="deleteUser(\'' + u._id + '\', \'' + u.name + '\')">삭제</button>';

          var row = '<td>' + u.name + '</td>'
            + '<td>' + u.email + '</td>'
            + '<td>' + badge + '</td>'
            + '<td>' + since + '</td>'
            + '<td>' + actions + '</td>';

          var tr = document.createElement('tr');
          tr.innerHTML = row;
          tbl.appendChild(tr);
        }
      });
    }

    function deleteUser(uid, name) {
      if (!confirm('"' + name + '" 유저를 삭제할까요? 되돌릴 수 없어요.')) return;
      fetch(SERVER + '/admin/users/' + uid + '/delete', { method: 'POST' }).then(function(r) {
        return r.json();
      }).then(function(result) {
        showMsg(result.message, !result.success);
        if (result.success) loadUsers();
      });
    }

    function promoteUser(uid) {
      if (!confirm('이 유저를 관리자로 승격할까요?')) return;
      fetch(SERVER + '/admin/users/' + uid + '/promote', { method: 'POST' }).then(function(r) {
        return r.json();
      }).then(function(result) {
        showMsg(result.message, !result.success);
        if (result.success) loadUsers();
      });
    }

    function demoteUser(uid) {
      if (!confirm('이 관리자를 일반 유저로 변경할까요?')) return;
      fetch(SERVER + '/admin/users/' + uid + '/demote', { method: 'POST' }).then(function(r) {
        return r.json();
      }).then(function(result) {
        showMsg(result.message, !result.success);
        if (result.success) loadUsers();
      });
    }

    // ── 모임 ──

    function resetActivitySearch() {
      document.getElementById('activity-keyword').value = '';
      loadActivities();
    }

    function loadActivities() {
      var word = document.getElementById('activity-keyword').value.trim();
      var link = SERVER + '/admin/activities';
      if (word) link += '?keyword=' + encodeURIComponent(word);

      fetch(link).then(function(r) {
        return r.json();
      }).then(function(result) {
        var tbl = document.getElementById('activity-tbody');
        tbl.innerHTML = '';

        if (!result.success) { showMsg('모임 목록을 불러오지 못했어요', true); return; }
        if (result.data.length === 0) {
          tbl.innerHTML = '<tr><td colspan="6">결과 없음</td></tr>';
          return;
        }

        for (var i = 0; i < result.data.length; i++) {
          var item = result.data[i];
          var info = encodeURIComponent(JSON.stringify(item));
          var safeTitle = item.title.replace(/'/g, "\\'");

          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + item.title + '</td>'
            + '<td>' + item.category + '</td>'
            + '<td>' + item.location + '</td>'
            + '<td>' + item.date + ' ' + item.time + '</td>'
            + '<td>' + item.participants + ' / ' + item.maxParticipants + '</td>'
            + '<td>'
            + '<button onclick="openEdit(\'' + info + '\')">수정</button> '
            + '<button onclick="deleteActivity(\'' + item._id + '\', \'' + safeTitle + '\')">삭제</button>'
            + '</td>';
          tbl.appendChild(tr);
        }
      });
    }

    function deleteActivity(aid, title) {
      if (!confirm('"' + title + '" 모임을 삭제할까요? 되돌릴 수 없어요.')) return;
      fetch(SERVER + '/admin/activities/' + aid + '/delete', { method: 'POST' }).then(function(r) {
        return r.json();
      }).then(function(result) {
        showMsg(result.message, !result.success);
        if (result.success) loadActivities();
      });
    }

    function openEdit(info) {
      var item = JSON.parse(decodeURIComponent(info));
      document.getElementById('edit-id').value = item._id;
      document.getElementById('edit-title').value = item.title;
      document.getElementById('edit-category').value = item.category;
      document.getElementById('edit-description').value = item.description || '';
      document.getElementById('edit-location').value = item.location;
      document.getElementById('edit-address').value = item.address || '';
      document.getElementById('edit-date').value = item.date;
      document.getElementById('edit-time').value = item.time;
      document.getElementById('edit-duration').value = item.duration || '';
      document.getElementById('edit-maxParticipants').value = item.maxParticipants;
      document.getElementById('edit-modal').style.display = '';
    }

    function closeModal() {
      document.getElementById('edit-modal').style.display = 'none';
    }

    function saveActivity() {
      var aid = document.getElementById('edit-id').value;
      var form = {
        title: document.getElementById('edit-title').value.trim(),
        category: document.getElementById('edit-category').value.trim(),
        description: document.getElementById('edit-description').value.trim(),
        location: document.getElementById('edit-location').value.trim(),
        address: document.getElementById('edit-address').value.trim(),
        date: document.getElementById('edit-date').value.trim(),
        time: document.getElementById('edit-time').value.trim(),
        duration: document.getElementById('edit-duration').value.trim(),
        maxParticipants: document.getElementById('edit-maxParticipants').value
      };

      fetch(SERVER + '/admin/activities/' + aid + '/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }).then(function(r) {
        return r.json();
      }).then(function(result) {
        showMsg(result.message, !result.success);
        if (result.success) { closeModal(); loadActivities(); }
      });
    }

    document.getElementById('edit-modal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });

    loadUsers();

    

    