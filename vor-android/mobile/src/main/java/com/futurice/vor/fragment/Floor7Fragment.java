package com.futurice.vor.fragment;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import com.futurice.vor.R;
import com.futurice.vor.Toilet;
import com.futurice.vor.utils.ToiletUtils;

import butterknife.Bind;
import butterknife.ButterKnife;

public class Floor7Fragment extends Fragment {
    @Bind(R.id.toilet7AM) RelativeLayout mToilet7AM;
    @Bind(R.id.toilet7BM) RelativeLayout mToilet7BM;

    Activity mActivity;

    SharedPreferences mToilet7amSP;
    SharedPreferences mToilet7bmSP;

    OnSharedPreferenceChangeListener toilet7amListener = (sharedPreferences, key) -> {
        ToiletUtils.updateView(sharedPreferences, key, mToilet7AM, getActivity());
    };

    OnSharedPreferenceChangeListener toilet7bmListener = (sharedPreferences, key) -> {
        ToiletUtils.updateView(sharedPreferences, key, mToilet7BM, getActivity());
    };

    public Floor7Fragment() {
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mActivity = getActivity();
        mToilet7amSP = mActivity.getSharedPreferences(Toilet.AM7.getId(), Context.MODE_PRIVATE);
        mToilet7bmSP = mActivity.getSharedPreferences(Toilet.BM7.getId(), Context.MODE_PRIVATE);
    }

    @Override
    public View onCreateView(LayoutInflater inflater,
                             ViewGroup container,
                             Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_floor_7_toilet, container, false);
        ButterKnife.bind(this, view);

        mToilet7AM.setOnClickListener(v -> {
            String id = mToilet7amSP.getString(Toilet.AM7.getId(), null);
            ToiletUtils.setClickListener(id, getActivity());
        });

        mToilet7BM.setOnClickListener(v -> {
            String id = mToilet7amSP.getString(Toilet.BM7.getId(), null);
            ToiletUtils.setClickListener(id, getActivity());
        });

        ToiletUtils.updateView(mToilet7amSP, Toilet.AM7.getId(), mToilet7AM, getActivity());
        ToiletUtils.updateView(mToilet7bmSP, Toilet.BM7.getId(), mToilet7BM, getActivity());

        return view;
    }

    @Override
    public void onResume() {
        super.onResume();
        mToilet7amSP.registerOnSharedPreferenceChangeListener(toilet7amListener);
        mToilet7bmSP.registerOnSharedPreferenceChangeListener(toilet7bmListener);

    }

    @Override
    public void onPause() {
        mToilet7amSP.unregisterOnSharedPreferenceChangeListener(toilet7amListener);
        mToilet7bmSP.unregisterOnSharedPreferenceChangeListener(toilet7bmListener);
        super.onPause();
    }
}
