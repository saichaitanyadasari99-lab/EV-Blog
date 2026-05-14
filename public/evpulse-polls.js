window.evpulsePollVote = async function(pollId, idx) {
  var storageKey = 'evpulse_poll_' + pollId;
  if (localStorage.getItem(storageKey)) return;
  try {
    var res = await fetch('/api/poll', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({pollId: pollId, optionIndex: idx})
    });
    if (res.status === 409) { localStorage.setItem(storageKey, '1'); return; }
    if (res.ok) {
      var data = await res.json();
      localStorage.setItem(storageKey, '1');
      if (data && data.counts) {
        evpulseShowPollResults(pollId, data.counts, data.total);
        return;
      }
    }
  } catch(e) {}
  // Fallback: store vote locally even if API fails
  localStorage.setItem(storageKey, '1');
  var localCounts = {};
  localCounts[idx] = 1;
  evpulseShowPollResults(pollId, localCounts, 1);
};
window.evpulseShowPollResults = function(pollId, counts, total) {
  var btns = document.querySelectorAll('[data-poll="' + pollId + '"]');
  btns.forEach(function(btn) {
    var i = parseInt(btn.getAttribute('data-option'), 10);
    var bar = document.getElementById(pollId + '_bar' + i);
    var pct = document.getElementById(pollId + '_pct' + i);
    var count = (counts || {})[i] || 0;
    var p = total > 0 ? Math.round(count / total * 100) : 0;
    btn.disabled = true;
    if (bar) setTimeout(function(){bar.style.width = p + '%';}, 50);
    if (pct) pct.textContent = p + '%';
  });
  var container = document.getElementById(pollId);
  var note = container ? container.querySelector('.poll-note') : null;
  if (note) note.textContent = total + ' vote' + (total !== 1 ? 's' : '');
};
window.evpulseLoadPolls = function() {
  document.querySelectorAll('.poll-block[data-poll-id]').forEach(function(el) {
    var pollId = el.getAttribute('data-poll-id');
    if (localStorage.getItem('evpulse_poll_' + pollId)) {
      var storageKey = 'evpulse_poll_data_' + pollId;
      var cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          var d = JSON.parse(cached);
          evpulseShowPollResults(pollId, d.counts, d.total);
          return;
        } catch(e) {}
      }
    }
    fetch('/api/poll?pollId=' + encodeURIComponent(pollId))
      .then(function(r){return r.json();})
      .then(function(data) {
        localStorage.setItem('evpulse_poll_data_' + pollId, JSON.stringify(data));
        evpulseShowPollResults(pollId, data.counts, data.total);
      })
      .catch(function(){});
  });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.evpulseLoadPolls();
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.poll-option[data-poll]');
      if (btn) {
        var pollId = btn.getAttribute('data-poll');
        var idx = parseInt(btn.getAttribute('data-option'), 10);
        window.evpulsePollVote(pollId, idx);
      }
    });
  });
} else {
  window.evpulseLoadPolls();
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.poll-option[data-poll]');
    if (btn) {
      var pollId = btn.getAttribute('data-poll');
      var idx = parseInt(btn.getAttribute('data-option'), 10);
      window.evpulsePollVote(pollId, idx);
    }
  });
}
window.evpulseTab = function(id, idx) {
  var btns = document.querySelectorAll('#' + id + ' .tab-btn');
  var panels = document.querySelectorAll('#' + id + ' .tab-panel');
  btns.forEach(function(b,i){b.classList.toggle('active', i===idx);});
  panels.forEach(function(p,i){p.classList.toggle('active', i===idx);});
};
